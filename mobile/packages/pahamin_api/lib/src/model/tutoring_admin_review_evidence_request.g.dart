// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tutoring_admin_review_evidence_request.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

TutoringAdminReviewEvidenceRequest _$TutoringAdminReviewEvidenceRequestFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('TutoringAdminReviewEvidenceRequest', json, (
  $checkedConvert,
) {
  final val = TutoringAdminReviewEvidenceRequest(
    action: $checkedConvert('action', (v) => v as String?),
  );
  return val;
});

Map<String, dynamic> _$TutoringAdminReviewEvidenceRequestToJson(
  TutoringAdminReviewEvidenceRequest instance,
) => <String, dynamic>{'action': ?instance.action};
