// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_admin_update_role_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

UserAdminUpdateRoleResponse _$UserAdminUpdateRoleResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('UserAdminUpdateRoleResponse', json, ($checkedConvert) {
  final val = UserAdminUpdateRoleResponse(
    message: $checkedConvert('message', (v) => v as String?),
  );
  return val;
});

Map<String, dynamic> _$UserAdminUpdateRoleResponseToJson(
  UserAdminUpdateRoleResponse instance,
) => <String, dynamic>{'message': ?instance.message};
