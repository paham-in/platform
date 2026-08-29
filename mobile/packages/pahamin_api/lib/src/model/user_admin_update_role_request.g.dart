// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_admin_update_role_request.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

UserAdminUpdateRoleRequest _$UserAdminUpdateRoleRequestFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('UserAdminUpdateRoleRequest', json, ($checkedConvert) {
  final val = UserAdminUpdateRoleRequest(
    roles: $checkedConvert(
      'roles',
      (v) => (v as List<dynamic>?)?.map((e) => e as String).toList(),
    ),
  );
  return val;
});

Map<String, dynamic> _$UserAdminUpdateRoleRequestToJson(
  UserAdminUpdateRoleRequest instance,
) => <String, dynamic>{'roles': ?instance.roles};
