//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'chapter_create_input.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class ChapterCreateInput {
  /// Returns a new [ChapterCreateInput] instance.
  ChapterCreateInput({

     this.classId,

     this.coverUrl,

     this.description,

     this.order,

     this.subjectId,

     this.title,
  });

  @JsonKey(
    
    name: r'class_id',
    required: false,
    includeIfNull: false,
  )


  final int? classId;



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
    
    name: r'order',
    required: false,
    includeIfNull: false,
  )


  final int? order;



  @JsonKey(
    
    name: r'subject_id',
    required: false,
    includeIfNull: false,
  )


  final int? subjectId;



  @JsonKey(
    
    name: r'title',
    required: false,
    includeIfNull: false,
  )


  final String? title;





    @override
    bool operator ==(Object other) => identical(this, other) || other is ChapterCreateInput &&
      other.classId == classId &&
      other.coverUrl == coverUrl &&
      other.description == description &&
      other.order == order &&
      other.subjectId == subjectId &&
      other.title == title;

    @override
    int get hashCode =>
        classId.hashCode +
        coverUrl.hashCode +
        description.hashCode +
        order.hashCode +
        subjectId.hashCode +
        title.hashCode;

  factory ChapterCreateInput.fromJson(Map<String, dynamic> json) => _$ChapterCreateInputFromJson(json);

  Map<String, dynamic> toJson() => _$ChapterCreateInputToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

