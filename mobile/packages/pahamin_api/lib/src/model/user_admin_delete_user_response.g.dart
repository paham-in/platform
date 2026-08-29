// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_admin_delete_user_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

UserAdminDeleteUserResponse _$UserAdminDeleteUserResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('UserAdminDeleteUserResponse', json, ($checkedConvert) {
  final val = UserAdminDeleteUserResponse(
    message: $checkedConvert('message', (v) => v as String?),
  );
  return val;
});

Map<String, dynamic> _$UserAdminDeleteUserResponseToJson(
  UserAdminDeleteUserResponse instance,
) => <String, dynamic>{'message': ?instance.message};
