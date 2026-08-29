//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'chapter_chapter_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class ChapterChapterResponse {
  /// Returns a new [ChapterChapterResponse] instance.
  ChapterChapterResponse({

     this.classId,

     this.className,

     this.coverUrl,

     this.description,

     this.id,

     this.materialCount,

     this.order,

     this.slug,

     this.subjectId,

     this.subjectName,

     this.title,
  });

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
    
    name: r'cover_url',
    required: false,
    includeIfNull: false,
  )


  final String? coverUrl;



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
    
    name: r'material_count',
    required: false,
    includeIfNull: false,
  )


  final int? materialCount;



  @JsonKey(
    
    name: r'order',
    required: false,
    includeIfNull: false,
  )


  final int? order;



  @JsonKey(
    
    name: r'slug',
    required: false,
    includeIfNull: false,
  )


  final String? slug;



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



  @JsonKey(
    
    name: r'title',
    required: false,
    includeIfNull: false,
  )


  final String? title;





    @override
    bool operator ==(Object other) => identical(this, other) || other is ChapterChapterResponse &&
      other.classId == classId &&
      other.className == className &&
      other.coverUrl == coverUrl &&
      other.description == description &&
      other.id == id &&
      other.materialCount == materialCount &&
      other.order == order &&
      other.slug == slug &&
      other.subjectId == subjectId &&
      other.subjectName == subjectName &&
      other.title == title;

    @override
    int get hashCode =>
        classId.hashCode +
        className.hashCode +
        coverUrl.hashCode +
        description.hashCode +
        id.hashCode +
        materialCount.hashCode +
        order.hashCode +
        slug.hashCode +
        subjectId.hashCode +
        subjectName.hashCode +
        title.hashCode;

  factory ChapterChapterResponse.fromJson(Map<String, dynamic> json) => _$ChapterChapterResponseFromJson(json);

  Map<String, dynamic> toJson() => _$ChapterChapterResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

