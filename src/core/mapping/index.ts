export { ensureProjectForUnmappedResource } from './ensure-project-for-resource';
export { slugifyName } from './slugify';
export {
  assignResourceToProject,
  findOrCreateProjectProvider,
  resourceMappingBodySchema,
} from './assign-resource';
export { setResourceArchived, resourceArchiveBodySchema } from './archive-resource';
export { suggestProjectForResource, isUnallocatedResource } from './suggest-project';
export { createProjectForResource } from './create-project-for-resource';
export type { ProjectSuggestion, ProjectSuggestCandidate } from './suggest-project';
