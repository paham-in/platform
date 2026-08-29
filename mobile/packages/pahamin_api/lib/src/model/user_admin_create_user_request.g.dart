// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_admin_create_user_request.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

UserAdminCreateUserRequest _$UserAdminCreateUserRequestFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('UserAdminCreateUserRequest', json, ($checkedConvert) {
  final val = UserAdminCreateUserRequest(
    email: $checkedConvert('email', (v) => v as String?),
    name: $checkedConvert('name', (v) => v as String?),
  );
  return val;
});

Map<String, dynamic> _$UserAdminCreateUserRequestToJson(
  UserAdminCreateUserRequest instance,
) => <String, dynamic>{'email': ?instance.email, 'name': ?instance.name};
