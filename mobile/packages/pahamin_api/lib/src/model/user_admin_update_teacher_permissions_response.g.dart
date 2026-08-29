// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_admin_update_teacher_permissions_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

UserAdminUpdateTeacherPermissionsResponse
_$UserAdminUpdateTeacherPermissionsResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('UserAdminUpdateTeacherPermissionsResponse', json, (
  $checkedConvert,
) {
  final val = UserAdminUpdateTeacherPermissionsResponse(
    message: $checkedConvert('message', (v) => v as String?),
  );
  return val;
});

Map<String, dynamic> _$UserAdminUpdateTeacherPermissionsResponseToJson(
  UserAdminUpdateTeacherPermissionsResponse instance,
) => <String, dynamic>{'message': ?instance.message};
