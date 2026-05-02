jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    position: {
      findUnique: jest.fn()
    },
    application: {
      findMany: jest.fn()
    }
  }))
}));

import { getCandidatesForPosition } from '../positionService';
import { PrismaClient } from '@prisma/client';

// positionService called `new PrismaClient()` on import — grab that instance
const MockedPrisma = PrismaClient as jest.MockedClass<typeof PrismaClient>;
const prismaInstance = MockedPrisma.mock.results[0].value;
const mockFindUnique: jest.Mock = prismaInstance.position.findUnique;
const mockFindMany: jest.Mock = prismaInstance.application.findMany;

describe('getCandidatesForPosition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error for invalid position ID (negative)', async () => {
    await expect(getCandidatesForPosition(-1)).rejects.toThrow('Invalid position ID');
  });

  it('should throw error for invalid position ID (zero)', async () => {
    await expect(getCandidatesForPosition(0)).rejects.toThrow('Invalid position ID');
  });

  it('should throw error for invalid position ID (NaN)', async () => {
    await expect(getCandidatesForPosition(NaN)).rejects.toThrow('Invalid position ID');
  });

  it('should throw error when position not found', async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(getCandidatesForPosition(999)).rejects.toThrow('Position not found');
  });

  it('should return empty array when position has no applications', async () => {
    mockFindUnique.mockResolvedValue({
      id: 1,
      companyId: 1,
      interviewFlowId: 1,
      title: 'Test Position',
      description: 'Test',
      status: 'Active',
      isVisible: true,
      location: 'Remote',
      jobDescription: 'Test'
    });

    mockFindMany.mockResolvedValue([]);

    const result = await getCandidatesForPosition(1);

    expect(result).toEqual([]);
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 1 }
    });
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { positionId: 1 },
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        interviews: {
          select: {
            score: true
          }
        }
      }
    });
  });

  it('should return candidates with correct data and average scores', async () => {
    mockFindUnique.mockResolvedValue({
      id: 1,
      companyId: 1,
      interviewFlowId: 1,
      title: 'Test Position',
      description: 'Test',
      status: 'Active',
      isVisible: true,
      location: 'Remote',
      jobDescription: 'Test'
    });

    mockFindMany.mockResolvedValue([
      {
        id: 1,
        positionId: 1,
        candidateId: 1,
        applicationDate: new Date('2024-01-15T10:00:00Z'),
        currentInterviewStep: 5,
        candidate: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com'
        },
        interviews: [
          { score: 8 },
          { score: 9 },
          { score: 7 }
        ]
      },
      {
        id: 2,
        positionId: 1,
        candidateId: 2,
        applicationDate: new Date('2024-01-16T11:00:00Z'),
        currentInterviewStep: 3,
        candidate: {
          id: 2,
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com'
        },
        interviews: [
          { score: 10 },
          { score: null },
          { score: 8 }
        ]
      }
    ]);

    const result = await getCandidatesForPosition(1);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      candidateId: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      applicationDate: '2024-01-15T10:00:00.000Z',
      currentInterviewStep: 5,
      averageScore: 8
    });
    expect(result[1]).toEqual({
      candidateId: 2,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      applicationDate: '2024-01-16T11:00:00.000Z',
      currentInterviewStep: 3,
      averageScore: 9
    });
  });

  it('should return null averageScore when candidate has no valid scores', async () => {
    mockFindUnique.mockResolvedValue({
      id: 1,
      companyId: 1,
      interviewFlowId: 1,
      title: 'Test Position',
      description: 'Test',
      status: 'Active',
      isVisible: true,
      location: 'Remote',
      jobDescription: 'Test'
    });

    mockFindMany.mockResolvedValue([
      {
        id: 1,
        positionId: 1,
        candidateId: 1,
        applicationDate: new Date('2024-01-15T10:00:00Z'),
        currentInterviewStep: 5,
        candidate: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com'
        },
        interviews: [
          { score: null },
          { score: null }
        ]
      }
    ]);

    const result = await getCandidatesForPosition(1);

    expect(result).toHaveLength(1);
    expect(result[0].averageScore).toBeNull();
  });

  it('should return null averageScore when candidate has no interviews', async () => {
    mockFindUnique.mockResolvedValue({
      id: 1,
      companyId: 1,
      interviewFlowId: 1,
      title: 'Test Position',
      description: 'Test',
      status: 'Active',
      isVisible: true,
      location: 'Remote',
      jobDescription: 'Test'
    });

    mockFindMany.mockResolvedValue([
      {
        id: 1,
        positionId: 1,
        candidateId: 1,
        applicationDate: new Date('2024-01-15T10:00:00Z'),
        currentInterviewStep: 5,
        candidate: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com'
        },
        interviews: []
      }
    ]);

    const result = await getCandidatesForPosition(1);

    expect(result).toHaveLength(1);
    expect(result[0].averageScore).toBeNull();
  });

  it('should handle null currentInterviewStep', async () => {
    mockFindUnique.mockResolvedValue({
      id: 1,
      companyId: 1,
      interviewFlowId: 1,
      title: 'Test Position',
      description: 'Test',
      status: 'Active',
      isVisible: true,
      location: 'Remote',
      jobDescription: 'Test'
    });

    mockFindMany.mockResolvedValue([
      {
        id: 1,
        positionId: 1,
        candidateId: 1,
        applicationDate: new Date('2024-01-15T10:00:00Z'),
        currentInterviewStep: null,
        candidate: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com'
        },
        interviews: [{ score: 8 }]
      }
    ]);

    const result = await getCandidatesForPosition(1);

    expect(result).toHaveLength(1);
    expect(result[0].currentInterviewStep).toBeNull();
  });

  it('should handle database errors', async () => {
    const dbError = new Error('Database connection failed');
    mockFindUnique.mockRejectedValue(dbError);

    await expect(getCandidatesForPosition(1)).rejects.toThrow('Database connection failed');
  });
});
