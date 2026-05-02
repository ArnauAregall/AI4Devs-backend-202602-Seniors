// ---------------------------------------------------------------------------
// Prisma mock — must be declared BEFORE any module that imports @prisma/client.
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
import request from 'supertest';
import express from 'express';
import candidateRoutes from '../../../routes/candidateRoutes';

describe('PUT /candidates/:id/stage', () => {
  let app: express.Express;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/candidates', candidateRoutes);
  });

  it('should return 200 when update successful', async () => {
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

    const response = await request(app)
      .put('/candidates/1/stage')
      .send({ currentInterviewStep: 5 })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: 'Candidate stage updated successfully',
      updatedApplications: 2
    });
  });

  it('should return 400 when invalid candidate id format - non-numeric', async () => {
    const response = await request(app)
      .put('/candidates/abc/stage')
      .send({ currentInterviewStep: 5 })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should return 400 when invalid candidate id format - negative', async () => {
    const response = await request(app)
      .put('/candidates/-1/stage')
      .send({ currentInterviewStep: 5 })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should return 400 when invalid candidate id format - zero', async () => {
    const response = await request(app)
      .put('/candidates/0/stage')
      .send({ currentInterviewStep: 5 })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should return 400 when invalid interview step - undefined', async () => {
    const response = await request(app)
      .put('/candidates/1/stage')
      .send({})
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should return 400 when invalid interview step - null', async () => {
    const response = await request(app)
      .put('/candidates/1/stage')
      .send({ currentInterviewStep: null })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should return 400 when invalid interview step - string', async () => {
    const response = await request(app)
      .put('/candidates/1/stage')
      .send({ currentInterviewStep: 'abc' })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should return 400 when invalid interview step - negative', async () => {
    const response = await request(app)
      .put('/candidates/1/stage')
      .send({ currentInterviewStep: -1 })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should return 400 when invalid interview step - zero', async () => {
    const response = await request(app)
      .put('/candidates/1/stage')
      .send({ currentInterviewStep: 0 })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should return 404 when candidate not found', async () => {
    mockCandidateFindUnique.mockResolvedValue(null);

    const response = await request(app)
      .put('/candidates/999/stage')
      .send({ currentInterviewStep: 5 })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Candidate not found' });
  });

  it('should return 404 when interview step not found', async () => {
    mockCandidateFindUnique.mockResolvedValue({
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    });
    mockInterviewStepFindUnique.mockResolvedValue(null);

    const response = await request(app)
      .put('/candidates/1/stage')
      .send({ currentInterviewStep: 999 })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Interview step not found' });
  });

  it('should return 400 when candidate has no applications', async () => {
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

    const response = await request(app)
      .put('/candidates/1/stage')
      .send({ currentInterviewStep: 5 })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Candidate has no applications' });
  });

  it('should return 500 when unexpected error occurs', async () => {
    mockCandidateFindUnique.mockRejectedValue(new Error('Database connection failed'));

    const response = await request(app)
      .put('/candidates/1/stage')
      .send({ currentInterviewStep: 5 })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal Server Error' });
  });
});
