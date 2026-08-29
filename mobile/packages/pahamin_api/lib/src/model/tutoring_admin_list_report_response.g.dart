// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tutoring_admin_list_report_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

TutoringAdminListReportResponse _$TutoringAdminListReportResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate(
  'TutoringAdminListReportResponse',
  json,
  ($checkedConvert) {
    final val = TutoringAdminListReportResponse(
      bookingId: $checkedConvert('booking_id', (v) => (v as num?)?.toInt()),
      cancelledCount: $checkedConvert(
        'cancelled_count',
        (v) => (v as num?)?.toInt(),
      ),
      doneCount: $checkedConvert('done_count', (v) => (v as num?)?.toInt()),
      feePerSession: $checkedConvert('fee_per_session', (v) => v as num?),
      feeUnpaidTotal: $checkedConvert('fee_unpaid_total', (v) => v as num?),
      invoiceStatus: $checkedConvert('invoice_status', (v) => v as String?),
      mode: $checkedConvert('mode', (v) => v as String?),
      pricePerSession: $checkedConvert('price_per_session', (v) => v as num?),
      refundAmount: $checkedConvert('refund_amount', (v) => v as num?),
      scheduledCount: $checkedConvert(
        'scheduled_count',
        (v) => (v as num?)?.toInt(),
      ),
      sessionCount: $checkedConvert(
        'session_count',
        (v) => (v as num?)?.toInt(),
      ),
      studentId: $checkedConvert('student_id', (v) => (v as num?)?.toInt()),
      studentName: $checkedConvert('student_name', (v) => v as String?),
      teacherName: $checkedConvert('teacher_name', (v) => v as String?),
    );
    return val;
  },
  fieldKeyMap: const {
    'bookingId': 'booking_id',
    'cancelledCount': 'cancelled_count',
    'doneCount': 'done_count',
    'feePerSession': 'fee_per_session',
    'feeUnpaidTotal': 'fee_unpaid_total',
    'invoiceStatus': 'invoice_status',
    'pricePerSession': 'price_per_session',
    'refundAmount': 'refund_amount',
    'scheduledCount': 'scheduled_count',
    'sessionCount': 'session_count',
    'studentId': 'student_id',
    'studentName': 'student_name',
    'teacherName': 'teacher_name',
  },
);

Map<String, dynamic> _$TutoringAdminListReportResponseToJson(
  TutoringAdminListReportResponse instance,
) => <String, dynamic>{
  'booking_id': ?instance.bookingId,
  'cancelled_count': ?instance.cancelledCount,
  'done_count': ?instance.doneCount,
  'fee_per_session': ?instance.feePerSession,
  'fee_unpaid_total': ?instance.feeUnpaidTotal,
  'invoice_status': ?instance.invoiceStatus,
  'mode': ?instance.mode,
  'price_per_session': ?instance.pricePerSession,
  'refund_amount': ?instance.refundAmount,
  'scheduled_count': ?instance.scheduledCount,
  'session_count': ?instance.sessionCount,
  'student_id': ?instance.studentId,
  'student_name': ?instance.studentName,
  'teacher_name': ?instance.teacherName,
};
