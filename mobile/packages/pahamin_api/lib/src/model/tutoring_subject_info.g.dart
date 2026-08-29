// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tutoring_subject_info.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

TutoringSubjectInfo _$TutoringSubjectInfoFromJson(Map<String, dynamic> json) =>
    $checkedCreate('TutoringSubjectInfo', json, ($checkedConvert) {
      final val = TutoringSubjectInfo(
        id: $checkedConvert('id', (v) => (v as num?)?.toInt()),
        name: $checkedConvert('name', (v) => v as String?),
      );
      return val;
    });

Map<String, dynamic> _$TutoringSubjectInfoToJson(
  TutoringSubjectInfo instance,
) => <String, dynamic>{'id': ?instance.id, 'name': ?instance.name};
