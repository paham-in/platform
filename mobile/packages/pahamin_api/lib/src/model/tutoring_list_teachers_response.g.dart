// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tutoring_list_teachers_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

TutoringListTeachersResponse _$TutoringListTeachersResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('TutoringListTeachersResponse', json, ($checkedConvert) {
  final val = TutoringListTeachersResponse(
    avatarUrl: $checkedConvert('avatar_url', (v) => v as String?),
    email: $checkedConvert('email', (v) => v as String?),
    id: $checkedConvert('id', (v) => (v as num?)?.toInt()),
    name: $checkedConvert('name', (v) => v as String?),
    subjects: $checkedConvert(
      'subjects',
      (v) => (v as List<dynamic>?)
          ?.map((e) => TutoringSubjectInfo.fromJson(e as Map<String, dynamic>))
          .toList(),
    ),
  );
  return val;
}, fieldKeyMap: const {'avatarUrl': 'avatar_url'});

Map<String, dynamic> _$TutoringListTeachersResponseToJson(
  TutoringListTeachersResponse instance,
) => <String, dynamic>{
  'avatar_url': ?instance.avatarUrl,
  'email': ?instance.email,
  'id': ?instance.id,
  'name': ?instance.name,
  'subjects': ?instance.subjects?.map((e) => e.toJson()).toList(),
};
