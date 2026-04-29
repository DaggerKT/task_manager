import ProjectsList from "./ProjectsList";
import { getProjects } from "@/actions/project";

export default async function Page() {
  const rawProjects = await getProjects();

  console.log("Raw projects data:", rawProjects);

  const formattedProjects = rawProjects.map(p => {
    // Quick progress calculation
    const totalTasks = p._count?.tasks || 0;
    const doneTasks = p.tasks?.length || 0;
    const progress = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

    return {
      id: p.id,
      name: p.name,
      status: p.status, // "Active", "Done", "Planning"
      progress: progress,
      members: p.team?._count?.members || 1, // Simulated via team 
      dueDate: p.dueDate ? p.dueDate.toISOString() : null,
    }
  });

  return (
    <ProjectsList initialProjects={formattedProjects} />
  );
}
