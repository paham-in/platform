import { queryOptions, type UseMutationOptions } from "@tanstack/react-query"
import { client } from "@/lib/api/client.gen"

// SEMENTARA: ditulis manual karena generator @hey-api/openapi-ts 0.99 crash
// di TypeScript 7. Bentuk mengikuti backend/internal/invoice (RefundClaimResponse).
// Hapus file ini setelah regen SDK bisa jalan lagi dan ganti pemakaiannya
// dengan hooks generated.
// PENTING: setiap pemanggilan client.* wajib sertakan `security`, kalau tidak
// header Authorization tidak ditempel dan server balas 401.

const authSecurity = [{ name: "Authorization", type: "apiKey" }] as const

export interface RefundClaim {
  id?: number;
  invoice_id?: number;
  session_id?: number | null;
  date?: string;
  start_time?: string;
  end_time?: string;
  amount?: number;
  done?: boolean;
  note?: string;
}

export const refundClaimsQueryKey = (invoiceId: number) =>
  ["admin", "refund-claims", invoiceId] as const
export const refundClaimsOptions = (invoiceId?: number) =>
  queryOptions({
    queryKey: refundClaimsQueryKey(invoiceId ?? 0),
    enabled: invoiceId != null,
    queryFn: async ({ signal }) => {
      const { data } = await client.get({
        security: [...authSecurity],
        url: `/admin/invoices/${invoiceId}/refund-claims`,
        signal,
        throwOnError: true,
      })
      return ((data as RefundClaim[] | undefined) ?? [])
    },
  })

export const refundClaimsByBookingQueryKey = (bookingId: number) =>
  ["admin", "booking-refund-claims", bookingId] as const

export const refundClaimsByBookingOptions = (bookingId?: number) =>
  queryOptions({
    queryKey: refundClaimsByBookingQueryKey(bookingId ?? 0),
    enabled: bookingId != null,
    queryFn: async ({ signal }) => {
      const { data } = await client.get({
        security: [...authSecurity],
        url: `/admin/tutoring/bookings/${bookingId}/refund-claims`,
        signal,
        throwOnError: true,
      })
      return ((data as RefundClaim[] | undefined) ?? [])
    },
  })

export const setClaimDoneMutation = (): UseMutationOptions<
  RefundClaim,
  unknown,
  { claimId: number; done: boolean }
> => ({
  mutationFn: async (v) => {
    const { data } = await client.patch({
      security: [...authSecurity],
      url: `/admin/refund-claims/${v.claimId}/done`,
      body: { done: v.done },
      throwOnError: true,
    })
    return data as RefundClaim
  },
})
