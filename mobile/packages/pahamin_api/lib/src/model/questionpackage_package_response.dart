//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:pahamin_api/src/model/questionpackage_package_question_response.dart';
import 'package:json_annotation/json_annotation.dart';

part 'questionpackage_package_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class QuestionpackagePackageResponse {
  /// Returns a new [QuestionpackagePackageResponse] instance.
  QuestionpackagePackageResponse({

     this.authorId,

     this.collectionId,

     this.collectionName,

     this.createdAt,

     this.description,

     this.id,

     this.isFree,

     this.name,

     this.publicId,

     this.questions,

     this.status,

     this.subjectId,

     this.subjectName,
  });

  @JsonKey(
    
    name: r'author_id',
    required: false,
    includeIfNull: false,
  )


  final int? authorId;



  @JsonKey(
    
    name: r'collection_id',
    required: false,
    includeIfNull: false,
  )


  final int? collectionId;



  @JsonKey(
    
    name: r'collection_name',
    required: false,
    includeIfNull: false,
  )


  final String? collectionName;



  @JsonKey(
    
    name: r'created_at',
    required: false,
    includeIfNull: false,
  )


  final String? createdAt;



  @JsonKey(
    
    name: r'description',
    required: false,
    includeIfNull: false,
  )


  final String? description;



  @JsonKey(
    
    name: r'id',
    required: false,
    includeIfNull: false,
  )


  final int? id;



  @JsonKey(
    
    name: r'is_free',
    required: false,
    includeIfNull: false,
  )


  final bool? isFree;



  @JsonKey(
    
    name: r'name',
    required: false,
    includeIfNull: false,
  )


  final String? name;



  @JsonKey(
    
    name: r'public_id',
    required: false,
    includeIfNull: false,
  )


  final String? publicId;



  @JsonKey(
    
    name: r'questions',
    required: false,
    includeIfNull: false,
  )


  final List<QuestionpackagePackageQuestionResponse>? questions;



  @JsonKey(
    
    name: r'status',
    required: false,
    includeIfNull: false,
  )


  final String? status;



  @JsonKey(
    
    name: r'subject_id',
    required: false,
    includeIfNull: false,
  )


  final int? subjectId;



  @JsonKey(
    
    name: r'subject_name',
    required: false,
    includeIfNull: false,
  )


  final String? subjectName;





    @override
    bool operator ==(Object other) => identical(this, other) || other is QuestionpackagePackageResponse &&
      other.authorId == authorId &&
      other.collectionId == collectionId &&
      other.collectionName == collectionName &&
      other.createdAt == createdAt &&
      other.description == description &&
      other.id == id &&
      other.isFree == isFree &&
      other.name == name &&
      other.publicId == publicId &&
      other.questions == questions &&
      other.status == status &&
      other.subjectId == subjectId &&
      other.subjectName == subjectName;

    @override
    int get hashCode =>
        authorId.hashCode +
        collectionId.hashCode +
        collectionName.hashCode +
        createdAt.hashCode +
        description.hashCode +
        id.hashCode +
        isFree.hashCode +
        name.hashCode +
        publicId.hashCode +
        questions.hashCode +
        status.hashCode +
        subjectId.hashCode +
        subjectName.hashCode;

  factory QuestionpackagePackageResponse.fromJson(Map<String, dynamic> json) => _$QuestionpackagePackageResponseFromJson(json);

  Map<String, dynamic> toJson() => _$QuestionpackagePackageResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

