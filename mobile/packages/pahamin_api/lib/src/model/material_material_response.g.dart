// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'material_material_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MaterialMaterialResponse _$MaterialMaterialResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate(
  'MaterialMaterialResponse',
  json,
  ($checkedConvert) {
    final val = MaterialMaterialResponse(
      authorId: $checkedConvert('author_id', (v) => (v as num?)?.toInt()),
      chapterId: $checkedConvert('chapter_id', (v) => (v as num?)?.toInt()),
      chapterName: $checkedConvert('chapter_name', (v) => v as String?),
      classId: $checkedConvert('class_id', (v) => (v as num?)?.toInt()),
      content: $checkedConvert('content', (v) => v as String?),
      description: $checkedConvert('description', (v) => v as String?),
      id: $checkedConvert('id', (v) => (v as num?)?.toInt()),
      isFree: $checkedConvert('is_free', (v) => v as bool?),
      order: $checkedConvert('order', (v) => (v as num?)?.toInt()),
      slug: $checkedConvert('slug', (v) => v as String?),
      status: $checkedConvert('status', (v) => v as String?),
      title: $checkedConvert('title', (v) => v as String?),
      type: $checkedConvert('type', (v) => v as String?),
      videoUrl: $checkedConvert('video_url', (v) => v as String?),
    );
    return val;
  },
  fieldKeyMap: const {
    'authorId': 'author_id',
    'chapterId': 'chapter_id',
    'chapterName': 'chapter_name',
    'classId': 'class_id',
    'isFree': 'is_free',
    'videoUrl': 'video_url',
  },
);

Map<String, dynamic> _$MaterialMaterialResponseToJson(
  MaterialMaterialResponse instance,
) => <String, dynamic>{
  'author_id': ?instance.authorId,
  'chapter_id': ?instance.chapterId,
  'chapter_name': ?instance.chapterName,
  'class_id': ?instance.classId,
  'content': ?instance.content,
  'description': ?instance.description,
  'id': ?instance.id,
  'is_free': ?instance.isFree,
  'order': ?instance.order,
  'slug': ?instance.slug,
  'status': ?instance.status,
  'title': ?instance.title,
  'type': ?instance.type,
  'video_url': ?instance.videoUrl,
};
