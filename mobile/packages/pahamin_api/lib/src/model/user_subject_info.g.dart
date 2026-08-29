// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_subject_info.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

UserSubjectInfo _$UserSubjectInfoFromJson(Map<String, dynamic> json) =>
    $checkedCreate('UserSubjectInfo', json, ($checkedConvert) {
      final val = UserSubjectInfo(
        id: $checkedConvert('id', (v) => (v as num?)?.toInt()),
        name: $checkedConvert('name', (v) => v as String?),
      );
      return val;
    });

Map<String, dynamic> _$UserSubjectInfoToJson(UserSubjectInfo instance) =>
    <String, dynamic>{'id': ?instance.id, 'name': ?instance.name};
