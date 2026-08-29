// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tutoring_admin_review_evidence_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

TutoringAdminReviewEvidenceResponse
_$TutoringAdminReviewEvidenceResponseFromJson(Map<String, dynamic> json) =>
    $checkedCreate(
      'TutoringAdminReviewEvidenceResponse',
      json,
      ($checkedConvert) {
        final val = TutoringAdminReviewEvidenceResponse(
          bookingId: $checkedConvert('booking_id', (v) => (v as num?)?.toInt()),
          date: $checkedConvert('date', (v) => v as String?),
          endTime: $checkedConvert('end_time', (v) => v as String?),
          evidenceUrl: $checkedConvert('evidence_url', (v) => v as String?),
          feeAmount: $checkedConvert('fee_amount', (v) => v as num?),
          feePaid: $checkedConvert('fee_paid', (v) => v as bool?),
          feeTaken: $checkedConvert('fee_taken', (v) => v as bool?),
          id: $checkedConvert('id', (v) => (v as num?)?.toInt()),
          invoicePaid: $checkedConvert('invoice_paid', (v) => v as bool?),
          mode: $checkedConvert('mode', (v) => v as String?),
          note: $checkedConvert('note', (v) => v as String?),
          startTime: $checkedConvert('start_time', (v) => v as String?),
          status: $checkedConvert('status', (v) => v as String?),
          studentId: $checkedConvert('student_id', (v) => (v as num?)?.toInt()),
          studentName: $checkedConvert('student_name', (v) => v as String?),
          teacherName: $checkedConvert('teacher_name', (v) => v as String?),
        );
        return val;
      },
      fieldKeyMap: const {
        'bookingId': 'booking_id',
        'endTime': 'end_time',
        'evidenceUrl': 'evidence_url',
        'feeAmount': 'fee_amount',
        'feePaid': 'fee_paid',
        'feeTaken': 'fee_taken',
        'invoicePaid': 'invoice_paid',
        'startTime': 'start_time',
        'studentId': 'student_id',
        'studentName': 'student_name',
        'teacherName': 'teacher_name',
      },
    );

Map<String, dynamic> _$TutoringAdminReviewEvidenceResponseToJson(
  TutoringAdminReviewEvidenceResponse instance,
) => <String, dynamic>{
  'booking_id': ?instance.bookingId,
  'date': ?instance.date,
  'end_time': ?instance.endTime,
  'evidence_url': ?instance.evidenceUrl,
  'fee_amount': ?instance.feeAmount,
  'fee_paid': ?instance.feePaid,
  'fee_taken': ?instance.feeTaken,
  'id': ?instance.id,
  'invoice_paid': ?instance.invoicePaid,
  'mode': ?instance.mode,
  'note': ?instance.note,
  'start_time': ?instance.startTime,
  'status': ?instance.status,
  'student_id': ?instance.studentId,
  'student_name': ?instance.studentName,
  'teacher_name': ?instance.teacherName,
};
