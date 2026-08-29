// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_update_profile_request.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

UserUpdateProfileRequest _$UserUpdateProfileRequestFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('UserUpdateProfileRequest', json, ($checkedConvert) {
  final val = UserUpdateProfileRequest(
    name: $checkedConvert('name', (v) => v as String?),
  );
  return val;
});

Map<String, dynamic> _$UserUpdateProfileRequestToJson(
  UserUpdateProfileRequest instance,
) => <String, dynamic>{'name': ?instance.name};
