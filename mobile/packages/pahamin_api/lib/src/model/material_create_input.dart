//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'material_create_input.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class MaterialCreateInput {
  /// Returns a new [MaterialCreateInput] instance.
  MaterialCreateInput({

     this.chapterId,

     this.content,

     this.description,

     this.isFree,

     this.order,

     this.status,

     this.title,

     this.type,

     this.videoUrl,
  });

  @JsonKey(
    
    name: r'chapter_id',
    required: false,
    includeIfNull: false,
  )


  final int? chapterId;



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
    bool operator ==(Object other) => identical(this, other) || other is MaterialCreateInput &&
      other.chapterId == chapterId &&
      other.content == content &&
      other.description == description &&
      other.isFree == isFree &&
      other.order == order &&
      other.status == status &&
      other.title == title &&
      other.type == type &&
      other.videoUrl == videoUrl;

    @override
    int get hashCode =>
        chapterId.hashCode +
        content.hashCode +
        description.hashCode +
        isFree.hashCode +
        order.hashCode +
        status.hashCode +
        title.hashCode +
        type.hashCode +
        videoUrl.hashCode;

  factory MaterialCreateInput.fromJson(Map<String, dynamic> json) => _$MaterialCreateInputFromJson(json);

  Map<String, dynamic> toJson() => _$MaterialCreateInputToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

