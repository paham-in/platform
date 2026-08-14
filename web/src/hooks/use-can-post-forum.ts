import { useQuery } from "@tanstack/react-query"
import { getMeOptions, getStudentClassesOptions } from "@/lib/api/@tanstack/react-query.gen"

/**
 * Apakah user boleh membuat postingan di forum.
 * - admin/teacher → selalu boleh (staff)
 * - student → butuh ≥1 kelas aktif (langganan konten ATAU les privat)
 * Mengembalikan undefined selama masih loading supaya UI tidak
 * berkedip ke state terkunci saat data belum siap.
 */
export function useCanPostForum(): boolean | undefined {
  const { data: me, isLoading: meLoading } = useQuery(getMeOptions())
  const { data: myClasses = [], isLoading: classesLoading } = useQuery(getStudentClassesOptions())

  if (meLoading || classesLoading) return undefined

  const roles = (me?.roles as string[] | undefined) ?? []
  if (roles.includes("admin") || roles.includes("teacher")) return true

  return myClasses.length > 0
}
