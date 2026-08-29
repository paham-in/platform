// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'questionpackage_package_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

QuestionpackagePackageResponse _$QuestionpackagePackageResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate(
  'QuestionpackagePackageResponse',
  json,
  ($checkedConvert) {
    final val = QuestionpackagePackageResponse(
      authorId: $checkedConvert('author_id', (v) => (v as num?)?.toInt()),
      collectionId: $checkedConvert(
        'collection_id',
        (v) => (v as num?)?.toInt(),
      ),
      collectionName: $checkedConvert('collection_name', (v) => v as String?),
      createdAt: $checkedConvert('created_at', (v) => v as String?),
      description: $checkedConvert('description', (v) => v as String?),
      id: $checkedConvert('id', (v) => (v as num?)?.toInt()),
      isFree: $checkedConvert('is_free', (v) => v as bool?),
      name: $checkedConvert('name', (v) => v as String?),
      publicId: $checkedConvert('public_id', (v) => v as String?),
      questions: $checkedConvert(
        'questions',
        (v) => (v as List<dynamic>?)
            ?.map(
              (e) => QuestionpackagePackageQuestionResponse.fromJson(
                e as Map<String, dynamic>,
              ),
            )
            .toList(),
      ),
      status: $checkedConvert('status', (v) => v as String?),
      subjectId: $checkedConvert('subject_id', (v) => (v as num?)?.toInt()),
      subjectName: $checkedConvert('subject_name', (v) => v as String?),
    );
    return val;
  },
  fieldKeyMap: const {
    'authorId': 'author_id',
    'collectionId': 'collection_id',
    'collectionName': 'collection_name',
    'createdAt': 'created_at',
    'isFree': 'is_free',
    'publicId': 'public_id',
    'subjectId': 'subject_id',
    'subjectName': 'subject_name',
  },
);

Map<String, dynamic> _$QuestionpackagePackageResponseToJson(
  QuestionpackagePackageResponse instance,
) => <String, dynamic>{
  'author_id': ?instance.authorId,
  'collection_id': ?instance.collectionId,
  'collection_name': ?instance.collectionName,
  'created_at': ?instance.createdAt,
  'description': ?instance.description,
  'id': ?instance.id,
  'is_free': ?instance.isFree,
  'name': ?instance.name,
  'public_id': ?instance.publicId,
  'questions': ?instance.questions?.map((e) => e.toJson()).toList(),
  'status': ?instance.status,
  'subject_id': ?instance.subjectId,
  'subject_name': ?instance.subjectName,
};
