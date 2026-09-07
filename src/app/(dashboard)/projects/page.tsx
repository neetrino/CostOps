import { redirect } from 'next/navigation';

type SearchParams = Record<string, string | string[] | undefined>;

type ProjectsIndexRedirectProps = {
  searchParams: Promise<SearchParams>;
};

export default async function ProjectsIndexRedirect({ searchParams }: ProjectsIndexRedirectProps) {
  const raw = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'string' && value.length > 0) {
      query.set(key, value);
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item) {
          query.append(key, item);
        }
      }
    }
  }
  const suffix = query.toString();
  redirect(suffix ? `/?${suffix}` : '/');
}
