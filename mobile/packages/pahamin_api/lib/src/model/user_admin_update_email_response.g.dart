// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_admin_update_email_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

UserAdminUpdateEmailResponse _$UserAdminUpdateEmailResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('UserAdminUpdateEmailResponse', json, ($checkedConvert) {
  final val = UserAdminUpdateEmailResponse(
    message: $checkedConvert('message', (v) => v as String?),
  );
  return val;
});

Map<String, dynamic> _$UserAdminUpdateEmailResponseToJson(
  UserAdminUpdateEmailResponse instance,
) => <String, dynamic>{'message': ?instance.message};
