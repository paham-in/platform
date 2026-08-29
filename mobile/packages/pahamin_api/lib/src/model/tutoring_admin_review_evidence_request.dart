//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'tutoring_admin_review_evidence_request.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class TutoringAdminReviewEvidenceRequest {
  /// Returns a new [TutoringAdminReviewEvidenceRequest] instance.
  TutoringAdminReviewEvidenceRequest({

     this.action,
  });

      /// approve/reject
  @JsonKey(
    
    name: r'action',
    required: false,
    includeIfNull: false,
  )


  final String? action;





    @override
    bool operator ==(Object other) => identical(this, other) || other is TutoringAdminReviewEvidenceRequest &&
      other.action == action;

    @override
    int get hashCode =>
        action.hashCode;

  factory TutoringAdminReviewEvidenceRequest.fromJson(Map<String, dynamic> json) => _$TutoringAdminReviewEvidenceRequestFromJson(json);

  Map<String, dynamic> toJson() => _$TutoringAdminReviewEvidenceRequestToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

