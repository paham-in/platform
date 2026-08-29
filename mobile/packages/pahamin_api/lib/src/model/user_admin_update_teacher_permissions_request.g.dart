// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_admin_update_teacher_permissions_request.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

UserAdminUpdateTeacherPermissionsRequest
_$UserAdminUpdateTeacherPermissionsRequestFromJson(Map<String, dynamic> json) =>
    $checkedCreate(
      'UserAdminUpdateTeacherPermissionsRequest',
      json,
      ($checkedConvert) {
        final val = UserAdminUpdateTeacherPermissionsRequest(
          canManageMaterials: $checkedConvert(
            'can_manage_materials',
            (v) => v as bool?,
          ),
          canManageQuestionPackages: $checkedConvert(
            'can_manage_question_packages',
            (v) => v as bool?,
          ),
        );
        return val;
      },
      fieldKeyMap: const {
        'canManageMaterials': 'can_manage_materials',
        'canManageQuestionPackages': 'can_manage_question_packages',
      },
    );

Map<String, dynamic> _$UserAdminUpdateTeacherPermissionsRequestToJson(
  UserAdminUpdateTeacherPermissionsRequest instance,
) => <String, dynamic>{
  'can_manage_materials': ?instance.canManageMaterials,
  'can_manage_question_packages': ?instance.canManageQuestionPackages,
};
