import { PrismaClient } from '@prisma/client';
import { Candidate } from '../../domain/models/Candidate';
import { validateCandidateData } from '../validator';
import { Education } from '../../domain/models/Education';
import { WorkExperience } from '../../domain/models/WorkExperience';
import { Resume } from '../../domain/models/Resume';
import { InterviewStep } from '../../domain/models/InterviewStep';

const prisma = new PrismaClient();

export const addCandidate = async (candidateData: any) => {
    try {
        validateCandidateData(candidateData); // Validar los datos del candidato
    } catch (error: any) {
        throw new Error(error);
    }

    const candidate = new Candidate(candidateData); // Crear una instancia del modelo Candidate
    try {
        const savedCandidate = await candidate.save(); // Guardar el candidato en la base de datos
        const candidateId = savedCandidate.id; // Obtener el ID del candidato guardado

        // Guardar la educación del candidato
        if (candidateData.educations) {
            for (const education of candidateData.educations) {
                const educationModel = new Education(education);
                educationModel.candidateId = candidateId;
                await educationModel.save();
                candidate.education.push(educationModel);
            }
        }

        // Guardar la experiencia laboral del candidato
        if (candidateData.workExperiences) {
            for (const experience of candidateData.workExperiences) {
                const experienceModel = new WorkExperience(experience);
                experienceModel.candidateId = candidateId;
                await experienceModel.save();
                candidate.workExperience.push(experienceModel);
            }
        }

        // Guardar los archivos de CV
        if (candidateData.cv && Object.keys(candidateData.cv).length > 0) {
            const resumeModel = new Resume(candidateData.cv);
            resumeModel.candidateId = candidateId;
            await resumeModel.save();
            candidate.resumes.push(resumeModel);
        }
        return savedCandidate;
    } catch (error: any) {
        if (error.code === 'P2002') {
            // Unique constraint failed on the fields: (`email`)
            throw new Error('The email already exists in the database');
        } else {
            throw error;
        }
    }
};

export const findCandidateById = async (id: number): Promise<Candidate | null> => {
    try {
        const candidate = await Candidate.findOne(id); // Cambio aquí: pasar directamente el id
        return candidate;
    } catch (error) {
        console.error('Error al buscar el candidato:', error);
        throw new Error('Error al recuperar el candidato');
    }
};

export interface UpdateCandidateStageResult {
    message: string;
    updatedApplications: number;
}

export const updateCandidateStage = async (
    candidateId: number,
    interviewStepId: number,
    db: PrismaClient = prisma
): Promise<UpdateCandidateStageResult> => {
    if (isNaN(candidateId) || candidateId <= 0) {
        throw new Error('Invalid candidate ID');
    }

    if (isNaN(interviewStepId) || interviewStepId <= 0) {
        throw new Error('Invalid interview step ID');
    }

    const candidate = await db.candidate.findUnique({
        where: { id: candidateId }
    });

    if (!candidate) {
        throw new Error('Candidate not found');
    }

    const interviewStep = await db.interviewStep.findUnique({
        where: { id: interviewStepId }
    });

    if (!interviewStep) {
        throw new Error('Interview step not found');
    }

    const applications = await db.application.findMany({
        where: { candidateId }
    });

    if (applications.length === 0) {
        throw new Error('Candidate has no applications');
    }

    const result = await db.application.updateMany({
        where: { candidateId },
        data: { currentInterviewStep: interviewStepId }
    });

    return {
        message: 'Candidate stage updated successfully',
        updatedApplications: result.count
    };
};
