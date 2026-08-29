//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'user_admin_update_teacher_subjects_request.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class UserAdminUpdateTeacherSubjectsRequest {
  /// Returns a new [UserAdminUpdateTeacherSubjectsRequest] instance.
  UserAdminUpdateTeacherSubjectsRequest({

     this.subjectIds,
  });

  @JsonKey(
    
    name: r'subject_ids',
    required: false,
    includeIfNull: false,
  )


  final List<int>? subjectIds;





    @override
    bool operator ==(Object other) => identical(this, other) || other is UserAdminUpdateTeacherSubjectsRequest &&
      other.subjectIds == subjectIds;

    @override
    int get hashCode =>
        subjectIds.hashCode;

  factory UserAdminUpdateTeacherSubjectsRequest.fromJson(Map<String, dynamic> json) => _$UserAdminUpdateTeacherSubjectsRequestFromJson(json);

  Map<String, dynamic> toJson() => _$UserAdminUpdateTeacherSubjectsRequestToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

