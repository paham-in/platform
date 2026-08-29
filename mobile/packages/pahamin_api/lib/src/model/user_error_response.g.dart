// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_error_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

UserErrorResponse _$UserErrorResponseFromJson(Map<String, dynamic> json) =>
    $checkedCreate('UserErrorResponse', json, ($checkedConvert) {
      final val = UserErrorResponse(
        error: $checkedConvert('error', (v) => v as String?),
      );
      return val;
    });

Map<String, dynamic> _$UserErrorResponseToJson(UserErrorResponse instance) =>
    <String, dynamic>{'error': ?instance.error};
