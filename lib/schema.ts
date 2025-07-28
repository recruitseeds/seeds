import {
  createSchema,
  definePermissions,
  ANYONE_CAN_DO_ANYTHING,
  PermissionsConfig,
  table,
  string,
  number,
  json,
} from "@rocicorp/zero";

const jobPostings = table("job_postings")
  .columns({
    id: string(),
    organization_id: string(),
    title: string(),
    content: json().optional(),
    department: string().optional(),
    job_type: string(),
    experience_level: string().optional(),
    hiring_manager_id: string().optional(),
    pipeline_id: string().optional(),
    status: string(),
    salary_min: number().optional(),
    salary_max: number().optional(),
    salary_type: string().optional(),
    published_at: string().optional(),
    created_at: string().optional(),
    updated_at: string().optional(),
    created_by: string(),
  })
  .primaryKey("id");

export const schema = createSchema({
  tables: [jobPostings],
});

export type Schema = typeof schema;

export const permissions = definePermissions<unknown, Schema>(schema, () => {
  return {
    job_postings: ANYONE_CAN_DO_ANYTHING,
  } satisfies PermissionsConfig<unknown, Schema>;
});
