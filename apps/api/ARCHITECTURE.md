# API Architecture: Public vs Internal Endpoints

## Overview

This document outlines the API structure for handling 20 endpoints:
- **8 Public Endpoints**: For external companies/clients (require Unkey authentication)
- **12 Internal Endpoints**: For internal operations (require internal auth token)

## API Structure

### Base URL Structure
```
https://api.recruitseeds.com/
├── /api/v1/public/     # 8 Public endpoints (external companies)
├── /api/v1/internal/   # 12 Internal endpoints (your team only)
└── /api/v1/health      # System health (no auth required)
```

### Authentication Strategy

#### Public Endpoints (`/api/v1/public/*`)
- **Authentication**: Unkey API keys
- **Rate Limiting**: Tier-based (Free: 100/hr, Pro: 1000/hr, Enterprise: Custom)
- **Validation**: Request validation → Business logic validation
- **Documentation**: Public OpenAPI docs
- **Usage**: External companies, third-party integrations

#### Internal Endpoints (`/api/v1/internal/*`)
- **Authentication**: Internal JWT tokens or API keys
- **Rate Limiting**: Higher limits (10,000+ requests/hour)
- **Validation**: Request validation → Internal permission checks
- **Documentation**: Internal OpenAPI docs (separate)
- **Usage**: Your internal dashboards, admin tools, data operations

## Proposed Endpoint Distribution

### 🌐 Public Endpoints (8) - For External Companies

1. **POST** `/api/v1/public/candidates/{id}/parse-resume`
   - Parse candidate resume and calculate job fit score
   - Most important endpoint for external customers

2. **GET** `/api/v1/public/candidates/{id}/score`
   - Retrieve candidate scoring results
   - Allows companies to fetch previously calculated scores

3. **POST** `/api/v1/public/jobs`
   - Create job posting with requirements
   - Companies can define their job requirements

4. **PUT** `/api/v1/public/jobs/{id}`
   - Update job posting requirements
   - Modify existing job requirements

5. **GET** `/api/v1/public/jobs/{id}/candidates`
   - Get ranked candidates for a job
   - Return scored candidates sorted by fit

6. **POST** `/api/v1/public/candidates/{id}/advance`
   - Move candidate through hiring pipeline
   - Trigger workflow automation

7. **GET** `/api/v1/public/pipeline/{id}/status`
   - Get hiring pipeline status
   - Track candidate progress through stages

8. **POST** `/api/v1/public/webhooks/events`
   - Receive hiring events from external systems
   - Integration with ATS, HRIS systems

### 🔒 Internal Endpoints (12) - For Your Team

1. **GET** `/api/v1/internal/analytics/dashboard`
   - Internal analytics dashboard data
   - Usage metrics, processing statistics

2. **POST** `/api/v1/internal/candidates/bulk-process`
   - Bulk process multiple resumes
   - Internal batch operations

3. **GET** `/api/v1/internal/candidates/search`
   - Advanced candidate search
   - Internal candidate database queries

4. **DELETE** `/api/v1/internal/candidates/{id}`
   - Delete candidate data (GDPR compliance)
   - Internal data management

5. **POST** `/api/v1/internal/admin/api-keys`
   - Generate new API keys for customers
   - Internal customer management

6. **GET** `/api/v1/internal/admin/usage-stats`
   - Detailed usage statistics
   - Billing and analytics data

7. **POST** `/api/v1/internal/admin/rate-limits`
   - Adjust customer rate limits
   - Internal account management

8. **GET** `/api/v1/internal/system/health-detailed`
   - Detailed system health metrics
   - Internal monitoring data

9. **POST** `/api/v1/internal/ai/retrain-model`
   - Trigger AI model retraining
   - Internal ML operations

10. **GET** `/api/v1/internal/logs/audit-trail`
    - Access audit logs
    - Internal compliance and debugging

11. **POST** `/api/v1/internal/data/export`
    - Export data for analysis
    - Internal data operations

12. **PUT** `/api/v1/internal/system/maintenance`
    - System maintenance operations
    - Internal infrastructure management

## Implementation Structure

### Directory Structure
```
src/
├── routes/
│   ├── v1/
│   │   ├── public/          # Public endpoints
│   │   │   ├── candidates.ts
│   │   │   ├── jobs.ts
│   │   │   ├── pipeline.ts
│   │   │   └── webhooks.ts
│   │   ├── internal/        # Internal endpoints
│   │   │   ├── analytics.ts
│   │   │   ├── admin.ts
│   │   │   ├── system.ts
│   │   │   └── data.ts
│   │   └── health.ts
│   └── index.ts
├── middleware/
│   ├── public-auth.ts       # Unkey authentication
│   ├── internal-auth.ts     # Internal token auth
│   ├── rate-limit.ts        # Tier-based rate limiting
│   └── validation.ts        # Request validation
└── schemas/
    ├── public/              # Public API schemas
    └── internal/            # Internal API schemas
```

### Middleware Stack

#### Public Endpoints Middleware Stack:
1. **CORS** - Cross-origin requests
2. **Rate Limiting** - Tier-based limits
3. **Public Authentication** - Unkey API key validation
4. **Request Validation** - Schema validation
5. **Business Logic Validation** - Company permissions
6. **Structured Logging** - Request tracking
7. **Error Handling** - Standardized error responses

#### Internal Endpoints Middleware Stack:
1. **Internal Authentication** - JWT/Internal API key
2. **Permission Checks** - Role-based access
3. **Request Validation** - Schema validation
4. **Audit Logging** - Enhanced logging for compliance
5. **Error Handling** - Internal error responses

### OpenAPI Documentation

#### Public Documentation (`/docs/public`)
- Customer-facing documentation
- Clean, professional presentation
- Examples and tutorials
- Authentication guide
- Rate limiting information

#### Internal Documentation (`/docs/internal`)
- Internal team documentation
- Detailed technical information
- Debugging guides
- System architecture notes

### Testing Strategy

#### Public Endpoints Testing:
- **Unit Tests**: Business logic validation
- **Integration Tests**: End-to-end workflows
- **Contract Tests**: API schema compliance
- **Performance Tests**: Rate limiting validation
- **Security Tests**: Authentication bypass attempts

#### Internal Endpoints Testing:
- **Unit Tests**: Core functionality
- **Integration Tests**: Internal system integration
- **Permission Tests**: Access control validation
- **Data Tests**: Data integrity and export validation

### Validation Layers

#### Layer 1: Request Schema Validation
```typescript
// Validate request format, required fields, data types
const schema = z.object({
  candidateId: z.string().uuid(),
  jobId: z.string().uuid(),
  fileContent: z.string().min(10),
})
```

#### Layer 2: Business Logic Validation
```typescript
// Public: Check if company owns the candidate/job
// Internal: Check user permissions and rate limits
async function validateBusinessRules(context) {
  if (isPublicEndpoint) {
    await validateCompanyOwnership(context)
  } else {
    await validateInternalPermissions(context)
  }
}
```

#### Layer 3: Data Validation
```typescript
// Validate data integrity, relationships, constraints
async function validateDataIntegrity(data) {
  await checkCandidateExists(data.candidateId)
  await checkJobExists(data.jobId)
}
```

## Benefits of This Architecture

1. **Clear Separation**: Public vs internal concerns are isolated
2. **Scalable**: Different rate limits and auth strategies
3. **Secure**: Separate authentication for different use cases  
4. **Maintainable**: Organized code structure
5. **Observable**: Different logging strategies for each audience
6. **Testable**: Comprehensive test coverage for both contexts
7. **Documented**: Separate documentation for different audiences

## Migration Strategy

1. **Phase 1**: Create the new route structure
2. **Phase 2**: Implement authentication middleware
3. **Phase 3**: Add validation layers
4. **Phase 4**: Create comprehensive tests
5. **Phase 5**: Generate separate OpenAPI documentation
6. **Phase 6**: Migrate existing endpoints to new structure

This architecture ensures your API is production-ready, secure, well-documented, and maintainable as you scale to serve both external customers and internal operations.