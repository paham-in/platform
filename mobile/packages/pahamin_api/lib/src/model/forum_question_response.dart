//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:pahamin_api/src/model/forum_answer_preview.dart';
import 'package:json_annotation/json_annotation.dart';

part 'forum_question_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class ForumQuestionResponse {
  /// Returns a new [ForumQuestionResponse] instance.
  ForumQuestionResponse({

     this.answerCount,

     this.content,

     this.createdAt,

     this.id,

     this.isOwner,

     this.plainContent,

     this.publicId,

     this.status,

     this.subjectId,

     this.subjectName,

     this.topAnswer,

     this.userAvatar,

     this.userName,
  });

  @JsonKey(
    
    name: r'answer_count',
    required: false,
    includeIfNull: false,
  )


  final int? answerCount;



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



  @JsonKey(
    
    name: r'top_answer',
    required: false,
    includeIfNull: false,
  )


  final ForumAnswerPreview? topAnswer;



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
    bool operator ==(Object other) => identical(this, other) || other is ForumQuestionResponse &&
      other.answerCount == answerCount &&
      other.content == content &&
      other.createdAt == createdAt &&
      other.id == id &&
      other.isOwner == isOwner &&
      other.plainContent == plainContent &&
      other.publicId == publicId &&
      other.status == status &&
      other.subjectId == subjectId &&
      other.subjectName == subjectName &&
      other.topAnswer == topAnswer &&
      other.userAvatar == userAvatar &&
      other.userName == userName;

    @override
    int get hashCode =>
        answerCount.hashCode +
        content.hashCode +
        createdAt.hashCode +
        id.hashCode +
        isOwner.hashCode +
        plainContent.hashCode +
        publicId.hashCode +
        status.hashCode +
        subjectId.hashCode +
        subjectName.hashCode +
        topAnswer.hashCode +
        userAvatar.hashCode +
        userName.hashCode;

  factory ForumQuestionResponse.fromJson(Map<String, dynamic> json) => _$ForumQuestionResponseFromJson(json);

  Map<String, dynamic> toJson() => _$ForumQuestionResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

