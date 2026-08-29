// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_logout_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

UserLogoutResponse _$UserLogoutResponseFromJson(Map<String, dynamic> json) =>
    $checkedCreate('UserLogoutResponse', json, ($checkedConvert) {
      final val = UserLogoutResponse(
        message: $checkedConvert('message', (v) => v as String?),
      );
      return val;
    });

Map<String, dynamic> _$UserLogoutResponseToJson(UserLogoutResponse instance) =>
    <String, dynamic>{'message': ?instance.message};
