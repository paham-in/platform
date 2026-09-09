import { queryOptions } from "@tanstack/react-query"
import { client } from "@/lib/api/client.gen"

// SEMENTARA: ditulis manual karena generator @hey-api/openapi-ts 0.99 crash
// di TypeScript 7 (ts.SyntaxKind undefined, tidak ada versi baru yang fix).
// Bentuk mengikuti backend/internal/tutoring/response.go
// (AdminTeacherScheduleResponse). Hapus file ini setelah regen SDK bisa jalan
// lagi dan ganti pemakaiannya dengan hooks generated.

export interface TeacherScheduleSubject {
  id?: number;
  name?: string;
}

export interface TeacherScheduleTeacher {
  id?: number;
  name?: string;
  email?: string;
  avatar_url?: string;
  subjects?: TeacherScheduleSubject[];
}

export interface TeacherScheduleSession {
  id?: number;
  booking_id?: number;
  date?: string;
  start_time?: string;
  end_time?: string;
  status?: string;
  student_name?: string;
  subject_name?: string;
  mode?: string;
  is_substitute?: boolean;
}

export interface TeacherSchedulePending {
  id?: number;
  date?: string;
  start_time?: string;
  end_time?: string;
  status?: string;
  student_name?: string;
  subject_name?: string;
  mode?: string;
  session_count?: number;
}

export interface TeacherScheduleResponse {
  teacher?: TeacherScheduleTeacher;
  sessions?: TeacherScheduleSession[];
  pending_bookings?: TeacherSchedulePending[];
}

export const teacherScheduleQueryKey = (teacherId: string) =>
  ["admin", "teacher-schedule", teacherId] as const

export const teacherScheduleOptions = (teacherId: string) =>
  queryOptions({
    queryKey: teacherScheduleQueryKey(teacherId),
    queryFn: async ({ signal }) => {
      const { data } = await client.get({
        // security wajib diisi: tanpa ini setAuthParams tidak menempelkan
        // header Authorization (pola yg sama dipakai semua fungsi generated).
        security: [{ name: "Authorization", type: "apiKey" }],
        url: `/admin/tutoring/teachers/${teacherId}/schedule`,
        signal,
        throwOnError: true,
      })
      return data as TeacherScheduleResponse
    },
  })
