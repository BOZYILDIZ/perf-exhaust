import ProjectForm, { EMPTY_PROJECT } from "@/components/admin/ProjectForm";

export const dynamic = "force-dynamic";

export default function NewProjectPage() {
  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-8" style={{ fontFamily: "Oswald, sans-serif" }}>
        Nouvelle réalisation
      </h1>
      <ProjectForm initial={EMPTY_PROJECT} blobConfigured={Boolean(process.env.BLOB_READ_WRITE_TOKEN)} />
    </div>
  );
}
