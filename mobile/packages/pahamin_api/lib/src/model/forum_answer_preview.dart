//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'forum_answer_preview.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class ForumAnswerPreview {
  /// Returns a new [ForumAnswerPreview] instance.
  ForumAnswerPreview({

     this.createdAt,

     this.plainContent,

     this.userAvatar,

     this.userName,
  });

  @JsonKey(
    
    name: r'created_at',
    required: false,
    includeIfNull: false,
  )


  final String? createdAt;



  @JsonKey(
    
    name: r'plain_content',
    required: false,
    includeIfNull: false,
  )


  final String? plainContent;



  @JsonKey(
    
    name: r'user_avatar',
    required: false,
    includeIfNull: false,
  )


  final String? userAvatar;



  @JsonKey(
    
    name: r'user_name',
    required: false,
    includeIfNull: false,
  )


  final String? userName;





    @override
    bool operator ==(Object other) => identical(this, other) || other is ForumAnswerPreview &&
      other.createdAt == createdAt &&
      other.plainContent == plainContent &&
      other.userAvatar == userAvatar &&
      other.userName == userName;

    @override
    int get hashCode =>
        createdAt.hashCode +
        plainContent.hashCode +
        userAvatar.hashCode +
        userName.hashCode;

  factory ForumAnswerPreview.fromJson(Map<String, dynamic> json) => _$ForumAnswerPreviewFromJson(json);

  Map<String, dynamic> toJson() => _$ForumAnswerPreviewToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

