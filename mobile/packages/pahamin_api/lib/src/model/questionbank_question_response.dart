//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:pahamin_api/src/model/questionbank_answer_response.dart';
import 'package:json_annotation/json_annotation.dart';

part 'questionbank_question_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class QuestionbankQuestionResponse {
  /// Returns a new [QuestionbankQuestionResponse] instance.
  QuestionbankQuestionResponse({

     this.answers,

     this.createdAt,

     this.explanation,

     this.id,

     this.packageId,

     this.question,

     this.userId,

     this.userName,
  });

  @JsonKey(
    
    name: r'answers',
    required: false,
    includeIfNull: false,
  )


  final List<QuestionbankAnswerResponse>? answers;



  @JsonKey(
    
    name: r'created_at',
    required: false,
    includeIfNull: false,
  )


  final String? createdAt;



  @JsonKey(
    
    name: r'explanation',
    required: false,
    includeIfNull: false,
  )


  final String? explanation;



  @JsonKey(
    
    name: r'id',
    required: false,
    includeIfNull: false,
  )


  final int? id;



  @JsonKey(
    
    name: r'package_id',
    required: false,
    includeIfNull: false,
  )


  final int? packageId;



  @JsonKey(
    
    name: r'question',
    required: false,
    includeIfNull: false,
  )


  final String? question;



  @JsonKey(
    
    name: r'user_id',
    required: false,
    includeIfNull: false,
  )


  final int? userId;



  @JsonKey(
    
    name: r'user_name',
    required: false,
    includeIfNull: false,
  )


  final String? userName;





    @override
    bool operator ==(Object other) => identical(this, other) || other is QuestionbankQuestionResponse &&
      other.answers == answers &&
      other.createdAt == createdAt &&
      other.explanation == explanation &&
      other.id == id &&
      other.packageId == packageId &&
      other.question == question &&
      other.userId == userId &&
      other.userName == userName;

    @override
    int get hashCode =>
        answers.hashCode +
        createdAt.hashCode +
        explanation.hashCode +
        id.hashCode +
        packageId.hashCode +
        question.hashCode +
        userId.hashCode +
        userName.hashCode;

  factory QuestionbankQuestionResponse.fromJson(Map<String, dynamic> json) => _$QuestionbankQuestionResponseFromJson(json);

  Map<String, dynamic> toJson() => _$QuestionbankQuestionResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

