//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'material_material_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class MaterialMaterialResponse {
  /// Returns a new [MaterialMaterialResponse] instance.
  MaterialMaterialResponse({

     this.authorId,

     this.chapterId,

     this.chapterName,

     this.classId,

     this.content,

     this.description,

     this.id,

     this.isFree,

     this.order,

     this.slug,

     this.status,

     this.title,

     this.type,

     this.videoUrl,
  });

  @JsonKey(
    
    name: r'author_id',
    required: false,
    includeIfNull: false,
  )


  final int? authorId;



  @JsonKey(
    
    name: r'chapter_id',
    required: false,
    includeIfNull: false,
  )


  final int? chapterId;



  @JsonKey(
    
    name: r'chapter_name',
    required: false,
    includeIfNull: false,
  )


  final String? chapterName;



  @JsonKey(
    
    name: r'class_id',
    required: false,
    includeIfNull: false,
  )


  final int? classId;



  @JsonKey(
    
    name: r'content',
    required: false,
    includeIfNull: false,
  )


  final String? content;



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
    
    name: r'status',
    required: false,
    includeIfNull: false,
  )


  final String? status;



  @JsonKey(
    
    name: r'title',
    required: false,
    includeIfNull: false,
  )


  final String? title;



  @JsonKey(
    
    name: r'type',
    required: false,
    includeIfNull: false,
  )


  final String? type;



  @JsonKey(
    
    name: r'video_url',
    required: false,
    includeIfNull: false,
  )


  final String? videoUrl;





    @override
    bool operator ==(Object other) => identical(this, other) || other is MaterialMaterialResponse &&
      other.authorId == authorId &&
      other.chapterId == chapterId &&
      other.chapterName == chapterName &&
      other.classId == classId &&
      other.content == content &&
      other.description == description &&
      other.id == id &&
      other.isFree == isFree &&
      other.order == order &&
      other.slug == slug &&
      other.status == status &&
      other.title == title &&
      other.type == type &&
      other.videoUrl == videoUrl;

    @override
    int get hashCode =>
        authorId.hashCode +
        chapterId.hashCode +
        chapterName.hashCode +
        classId.hashCode +
        content.hashCode +
        description.hashCode +
        id.hashCode +
        isFree.hashCode +
        order.hashCode +
        slug.hashCode +
        status.hashCode +
        title.hashCode +
        type.hashCode +
        videoUrl.hashCode;

  factory MaterialMaterialResponse.fromJson(Map<String, dynamic> json) => _$MaterialMaterialResponseFromJson(json);

  Map<String, dynamic> toJson() => _$MaterialMaterialResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

