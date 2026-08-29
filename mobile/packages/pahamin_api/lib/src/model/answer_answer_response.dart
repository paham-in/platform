//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'answer_answer_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class AnswerAnswerResponse {
  /// Returns a new [AnswerAnswerResponse] instance.
  AnswerAnswerResponse({

     this.content,

     this.createdAt,

     this.id,

     this.isOwner,

     this.plainContent,

     this.publicId,

     this.userAvatar,

     this.userName,

     this.videoUrl,
  });

  @JsonKey(
    
    name: r'content',
    required: false,
    includeIfNull: false,
  )


  final String? content;



  @JsonKey(
    
    name: r'created_at',
    required: false,
    includeIfNull: false,
  )


  final String? createdAt;



  @JsonKey(
    
    name: r'id',
    required: false,
    includeIfNull: false,
  )


  final int? id;



  @JsonKey(
    
    name: r'is_owner',
    required: false,
    includeIfNull: false,
  )


  final bool? isOwner;



  @JsonKey(
    
    name: r'plain_content',
    required: false,
    includeIfNull: false,
  )


  final String? plainContent;



  @JsonKey(
    
    name: r'public_id',
    required: false,
    includeIfNull: false,
  )


  final String? publicId;



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



  @JsonKey(
    
    name: r'video_url',
    required: false,
    includeIfNull: false,
  )


  final String? videoUrl;





    @override
    bool operator ==(Object other) => identical(this, other) || other is AnswerAnswerResponse &&
      other.content == content &&
      other.createdAt == createdAt &&
      other.id == id &&
      other.isOwner == isOwner &&
      other.plainContent == plainContent &&
      other.publicId == publicId &&
      other.userAvatar == userAvatar &&
      other.userName == userName &&
      other.videoUrl == videoUrl;

    @override
    int get hashCode =>
        content.hashCode +
        createdAt.hashCode +
        id.hashCode +
        isOwner.hashCode +
        plainContent.hashCode +
        publicId.hashCode +
        userAvatar.hashCode +
        userName.hashCode +
        videoUrl.hashCode;

  factory AnswerAnswerResponse.fromJson(Map<String, dynamic> json) => _$AnswerAnswerResponseFromJson(json);

  Map<String, dynamic> toJson() => _$AnswerAnswerResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

