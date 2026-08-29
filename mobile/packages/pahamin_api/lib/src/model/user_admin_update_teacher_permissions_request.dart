//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'user_admin_update_teacher_permissions_request.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class UserAdminUpdateTeacherPermissionsRequest {
  /// Returns a new [UserAdminUpdateTeacherPermissionsRequest] instance.
  UserAdminUpdateTeacherPermissionsRequest({

     this.canManageMaterials,

     this.canManageQuestionPackages,
  });

  @JsonKey(
    
    name: r'can_manage_materials',
    required: false,
    includeIfNull: false,
  )


  final bool? canManageMaterials;



  @JsonKey(
    
    name: r'can_manage_question_packages',
    required: false,
    includeIfNull: false,
  )


  final bool? canManageQuestionPackages;





    @override
    bool operator ==(Object other) => identical(this, other) || other is UserAdminUpdateTeacherPermissionsRequest &&
      other.canManageMaterials == canManageMaterials &&
      other.canManageQuestionPackages == canManageQuestionPackages;

    @override
    int get hashCode =>
        canManageMaterials.hashCode +
        canManageQuestionPackages.hashCode;

  factory UserAdminUpdateTeacherPermissionsRequest.fromJson(Map<String, dynamic> json) => _$UserAdminUpdateTeacherPermissionsRequestFromJson(json);

  Map<String, dynamic> toJson() => _$UserAdminUpdateTeacherPermissionsRequestToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

