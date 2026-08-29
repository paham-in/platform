// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'chapter_update_input.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ChapterUpdateInput _$ChapterUpdateInputFromJson(Map<String, dynamic> json) =>
    $checkedCreate(
      'ChapterUpdateInput',
      json,
      ($checkedConvert) {
        final val = ChapterUpdateInput(
          classId: $checkedConvert('class_id', (v) => (v as num?)?.toInt()),
          coverUrl: $checkedConvert('cover_url', (v) => v as String?),
          description: $checkedConvert('description', (v) => v as String?),
          order: $checkedConvert('order', (v) => (v as num?)?.toInt()),
          subjectId: $checkedConvert('subject_id', (v) => (v as num?)?.toInt()),
          title: $checkedConvert('title', (v) => v as String?),
        );
        return val;
      },
      fieldKeyMap: const {
        'classId': 'class_id',
        'coverUrl': 'cover_url',
        'subjectId': 'subject_id',
      },
    );

Map<String, dynamic> _$ChapterUpdateInputToJson(ChapterUpdateInput instance) =>
    <String, dynamic>{
      'class_id': ?instance.classId,
      'cover_url': ?instance.coverUrl,
      'description': ?instance.description,
      'order': ?instance.order,
      'subject_id': ?instance.subjectId,
      'title': ?instance.title,
    };
