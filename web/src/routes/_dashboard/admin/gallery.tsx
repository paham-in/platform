import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { GalleryBrowser } from "@/components/gallery-browser"
import { getSubjectsOptions } from "@/lib/api/@tanstack/react-query.gen"

function AdminGallery() {
  const { data: subjects = [] } = useQuery(getSubjectsOptions())
  return <GalleryBrowser subjects={subjects} />
}

export const Route = createFileRoute("/_dashboard/admin/gallery")({
  component: AdminGallery,
})
