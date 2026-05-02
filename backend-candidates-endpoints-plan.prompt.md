# Role
Backend developer familiar with the existing codebase architecture, patterns, and conventions.

# Objective
Produce a detailed implementation plan for adding two new backend endpoints to the Applicant Tracking System.

# Context
This is an Applicant Tracking System codebase with the following database structure:
- `candidates` table: stores candidate information including full name
- `applications` table: stores applications linking candidates to positions, includes `current_interview_step` field and `positionId`
- `interviews` table: stores interview records with `score` values

The agent must inspect the codebase to understand:
- Existing routing patterns and endpoint structure
- Database models and ORM usage
- Controller/service layer patterns
- Authentication/authorization approach
- Error handling conventions
- Testing patterns

# Requirements

## Mandatory Endpoints

### PUT /candidates/:id/stage
- Updates the candidate's current stage in the interview process
- Action: modifies the `current_interview_step` field for a specific candidate across all their applications and positions
- Input: `candidateId` from route parameter

### GET /positions/:id/candidates
- Retrieves all candidates currently in process for a given position (all applications for a given `positionId`)
- Response must include:
  - Candidate's full name (from the `candidates` table)
  - `current_interview_step`: the current stage in the process (from the `applications` table)
  - Candidate's average score: mean of the `score` values across all interviews (from the `interviews` table) completed by that candidate

# Output format
Produce a markdown implementation plan that includes:

1. **Codebase analysis summary**: Key architectural patterns discovered, relevant files identified
2. **Implementation approach**: Step-by-step plan for each endpoint including:
   - Files to create or modify
   - Database queries required
   - Integration points with existing code
3. **Code snippets**: Example implementations following existing codebase conventions
4. **Testing considerations**: How to test the new endpoints based on existing patterns

The plan must be actionable for immediate implementation.

The plans must be split by endpoint, hence we will require two different markdown files, one for each endpoint. Each file should be named according to the endpoint it describes (e.g., `update_candidate_stage.plan.md` and `get_position_candidates.plan.md`).
