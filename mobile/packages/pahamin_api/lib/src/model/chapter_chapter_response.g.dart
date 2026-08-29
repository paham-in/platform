// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'chapter_chapter_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ChapterChapterResponse _$ChapterChapterResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate(
  'ChapterChapterResponse',
  json,
  ($checkedConvert) {
    final val = ChapterChapterResponse(
      classId: $checkedConvert('class_id', (v) => (v as num?)?.toInt()),
      className: $checkedConvert('class_name', (v) => v as String?),
      coverUrl: $checkedConvert('cover_url', (v) => v as String?),
      description: $checkedConvert('description', (v) => v as String?),
      id: $checkedConvert('id', (v) => (v as num?)?.toInt()),
      materialCount: $checkedConvert(
        'material_count',
        (v) => (v as num?)?.toInt(),
      ),
      order: $checkedConvert('order', (v) => (v as num?)?.toInt()),
      slug: $checkedConvert('slug', (v) => v as String?),
      subjectId: $checkedConvert('subject_id', (v) => (v as num?)?.toInt()),
      subjectName: $checkedConvert('subject_name', (v) => v as String?),
      title: $checkedConvert('title', (v) => v as String?),
    );
    return val;
  },
  fieldKeyMap: const {
    'classId': 'class_id',
    'className': 'class_name',
    'coverUrl': 'cover_url',
    'materialCount': 'material_count',
    'subjectId': 'subject_id',
    'subjectName': 'subject_name',
  },
);

Map<String, dynamic> _$ChapterChapterResponseToJson(
  ChapterChapterResponse instance,
) => <String, dynamic>{
  'class_id': ?instance.classId,
  'class_name': ?instance.className,
  'cover_url': ?instance.coverUrl,
  'description': ?instance.description,
  'id': ?instance.id,
  'material_count': ?instance.materialCount,
  'order': ?instance.order,
  'slug': ?instance.slug,
  'subject_id': ?instance.subjectId,
  'subject_name': ?instance.subjectName,
  'title': ?instance.title,
};
