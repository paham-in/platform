//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:pahamin_api/src/model/questionpackage_package_response.dart';
import 'package:json_annotation/json_annotation.dart';

part 'questionpackage_collection_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class QuestionpackageCollectionResponse {
  /// Returns a new [QuestionpackageCollectionResponse] instance.
  QuestionpackageCollectionResponse({

     this.authorId,

     this.classId,

     this.className,

     this.createdAt,

     this.description,

     this.id,

     this.isFree,

     this.name,

     this.packageCount,

     this.packages,

     this.publicId,
  });

  @JsonKey(
    
    name: r'author_id',
    required: false,
    includeIfNull: false,
  )


  final int? authorId;



  @JsonKey(
    
    name: r'class_id',
    required: false,
    includeIfNull: false,
  )


  final int? classId;



  @JsonKey(
    
    name: r'class_name',
    required: false,
    includeIfNull: false,
  )


  final String? className;



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
    
    name: r'package_count',
    required: false,
    includeIfNull: false,
  )


  final int? packageCount;



  @JsonKey(
    
    name: r'packages',
    required: false,
    includeIfNull: false,
  )


  final List<QuestionpackagePackageResponse>? packages;



  @JsonKey(
    
    name: r'public_id',
    required: false,
    includeIfNull: false,
  )


  final String? publicId;





    @override
    bool operator ==(Object other) => identical(this, other) || other is QuestionpackageCollectionResponse &&
      other.authorId == authorId &&
      other.classId == classId &&
      other.className == className &&
      other.createdAt == createdAt &&
      other.description == description &&
      other.id == id &&
      other.isFree == isFree &&
      other.name == name &&
      other.packageCount == packageCount &&
      other.packages == packages &&
      other.publicId == publicId;

    @override
    int get hashCode =>
        authorId.hashCode +
        classId.hashCode +
        className.hashCode +
        createdAt.hashCode +
        description.hashCode +
        id.hashCode +
        isFree.hashCode +
        name.hashCode +
        packageCount.hashCode +
        packages.hashCode +
        publicId.hashCode;

  factory QuestionpackageCollectionResponse.fromJson(Map<String, dynamic> json) => _$QuestionpackageCollectionResponseFromJson(json);

  Map<String, dynamic> toJson() => _$QuestionpackageCollectionResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

