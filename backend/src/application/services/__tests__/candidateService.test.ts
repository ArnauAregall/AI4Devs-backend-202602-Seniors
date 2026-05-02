// ---------------------------------------------------------------------------
// Prisma mock — must be declared BEFORE any module that imports @prisma/client.
//
// We spread jest.requireActual('@prisma/client') into the return value so that
// the real Prisma namespace (including the real PrismaClientInitializationError
// class) is preserved.  This is essential for US-11: Candidate.save() uses
// `instanceof Prisma.PrismaClientInitializationError`, and that check only
// passes when both sides reference the same class object from the real package.
// ---------------------------------------------------------------------------
const mockCandidateFindUnique = jest.fn();
const mockCandidateCreate = jest.fn();
const mockEducationCreate = jest.fn();
const mockWorkExperienceCreate = jest.fn();
const mockResumeCreate = jest.fn();
const mockInterviewStepFindUnique = jest.fn();
const mockApplicationFindMany = jest.fn();
const mockApplicationUpdateMany = jest.fn();

jest.mock('@prisma/client', () => {
  const actual = jest.requireActual('@prisma/client');

  const mockPrismaClient = jest.fn().mockImplementation(() => ({
    candidate: {
      create: mockCandidateCreate,
      update: jest.fn(),
      findUnique: mockCandidateFindUnique,
    },
    education: {
      create: mockEducationCreate,
      update: jest.fn(),
    },
    workExperience: {
      create: mockWorkExperienceCreate,
      update: jest.fn(),
    },
    resume: {
      create: mockResumeCreate,
    },
    interviewStep: {
      findUnique: mockInterviewStepFindUnique,
    },
    application: {
      findMany: mockApplicationFindMany,
      updateMany: mockApplicationUpdateMany,
    },
  }));

  return {
    ...actual,
    PrismaClient: mockPrismaClient,
  };
});

// ---------------------------------------------------------------------------
// Imports (after all jest.mock calls)
// ---------------------------------------------------------------------------
import { updateCandidateStage } from '../candidateService';

describe('updateCandidateStage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error for invalid candidate ID (negative)', async () => {
    await expect(updateCandidateStage(-1, 1)).rejects.toThrow('Invalid candidate ID');
  });

  it('should throw error for invalid candidate ID (zero)', async () => {
    await expect(updateCandidateStage(0, 1)).rejects.toThrow('Invalid candidate ID');
  });

  it('should throw error for invalid candidate ID (NaN)', async () => {
    await expect(updateCandidateStage(NaN, 1)).rejects.toThrow('Invalid candidate ID');
  });

  it('should throw error for invalid interview step ID (negative)', async () => {
    await expect(updateCandidateStage(1, -1)).rejects.toThrow('Invalid interview step ID');
  });

  it('should throw error for invalid interview step ID (zero)', async () => {
    await expect(updateCandidateStage(1, 0)).rejects.toThrow('Invalid interview step ID');
  });

  it('should throw error for invalid interview step ID (NaN)', async () => {
    await expect(updateCandidateStage(1, NaN)).rejects.toThrow('Invalid interview step ID');
  });

  it('should throw error when candidate not found', async () => {
    mockCandidateFindUnique.mockResolvedValue(null);

    await expect(updateCandidateStage(999, 1)).rejects.toThrow('Candidate not found');
  });

  it('should throw error when interview step not found', async () => {
    mockCandidateFindUnique.mockResolvedValue({
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    });
    mockInterviewStepFindUnique.mockResolvedValue(null);

    await expect(updateCandidateStage(1, 999)).rejects.toThrow('Interview step not found');
  });

  it('should throw error when candidate has no applications', async () => {
    mockCandidateFindUnique.mockResolvedValue({
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    });
    mockInterviewStepFindUnique.mockResolvedValue({
      id: 5,
      name: 'Technical Interview',
      orderIndex: 2
    });
    mockApplicationFindMany.mockResolvedValue([]);

    await expect(updateCandidateStage(1, 5)).rejects.toThrow('Candidate has no applications');
  });

  it('should update all applications for the candidate', async () => {
    mockCandidateFindUnique.mockResolvedValue({
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    });
    mockInterviewStepFindUnique.mockResolvedValue({
      id: 5,
      name: 'Technical Interview',
      orderIndex: 2
    });
    mockApplicationFindMany.mockResolvedValue([
      { id: 1, candidateId: 1, positionId: 1, currentInterviewStep: 3 },
      { id: 2, candidateId: 1, positionId: 2, currentInterviewStep: 4 }
    ]);
    mockApplicationUpdateMany.mockResolvedValue({ count: 2 });

    const result = await updateCandidateStage(1, 5);

    expect(mockCandidateFindUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(mockInterviewStepFindUnique).toHaveBeenCalledWith({ where: { id: 5 } });
    expect(mockApplicationFindMany).toHaveBeenCalledWith({ where: { candidateId: 1 } });
    expect(mockApplicationUpdateMany).toHaveBeenCalledWith({
      where: { candidateId: 1 },
      data: { currentInterviewStep: 5 }
    });
    expect(result).toEqual({
      message: 'Candidate stage updated successfully',
      updatedApplications: 2
    });
  });

  it('should update a single application for the candidate', async () => {
    mockCandidateFindUnique.mockResolvedValue({
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    });
    mockInterviewStepFindUnique.mockResolvedValue({
      id: 3,
      name: 'HR Interview',
      orderIndex: 1
    });
    mockApplicationFindMany.mockResolvedValue([
      { id: 1, candidateId: 1, positionId: 1, currentInterviewStep: 2 }
    ]);
    mockApplicationUpdateMany.mockResolvedValue({ count: 1 });

    const result = await updateCandidateStage(1, 3);

    expect(mockApplicationUpdateMany).toHaveBeenCalledWith({
      where: { candidateId: 1 },
      data: { currentInterviewStep: 3 }
    });
    expect(result).toEqual({
      message: 'Candidate stage updated successfully',
      updatedApplications: 1
    });
  });

  it('should handle database errors', async () => {
    const dbError = new Error('Database connection failed');
    mockCandidateFindUnique.mockRejectedValue(dbError);

    await expect(updateCandidateStage(1, 5)).rejects.toThrow('Database connection failed');
  });
});
