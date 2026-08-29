// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'questionpackage_collection_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

QuestionpackageCollectionResponse _$QuestionpackageCollectionResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate(
  'QuestionpackageCollectionResponse',
  json,
  ($checkedConvert) {
    final val = QuestionpackageCollectionResponse(
      authorId: $checkedConvert('author_id', (v) => (v as num?)?.toInt()),
      classId: $checkedConvert('class_id', (v) => (v as num?)?.toInt()),
      className: $checkedConvert('class_name', (v) => v as String?),
      createdAt: $checkedConvert('created_at', (v) => v as String?),
      description: $checkedConvert('description', (v) => v as String?),
      id: $checkedConvert('id', (v) => (v as num?)?.toInt()),
      isFree: $checkedConvert('is_free', (v) => v as bool?),
      name: $checkedConvert('name', (v) => v as String?),
      packageCount: $checkedConvert(
        'package_count',
        (v) => (v as num?)?.toInt(),
      ),
      packages: $checkedConvert(
        'packages',
        (v) => (v as List<dynamic>?)
            ?.map(
              (e) => QuestionpackagePackageResponse.fromJson(
                e as Map<String, dynamic>,
              ),
            )
            .toList(),
      ),
      publicId: $checkedConvert('public_id', (v) => v as String?),
    );
    return val;
  },
  fieldKeyMap: const {
    'authorId': 'author_id',
    'classId': 'class_id',
    'className': 'class_name',
    'createdAt': 'created_at',
    'isFree': 'is_free',
    'packageCount': 'package_count',
    'publicId': 'public_id',
  },
);

Map<String, dynamic> _$QuestionpackageCollectionResponseToJson(
  QuestionpackageCollectionResponse instance,
) => <String, dynamic>{
  'author_id': ?instance.authorId,
  'class_id': ?instance.classId,
  'class_name': ?instance.className,
  'created_at': ?instance.createdAt,
  'description': ?instance.description,
  'id': ?instance.id,
  'is_free': ?instance.isFree,
  'name': ?instance.name,
  'package_count': ?instance.packageCount,
  'packages': ?instance.packages?.map((e) => e.toJson()).toList(),
  'public_id': ?instance.publicId,
};
