//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:pahamin_api/src/model/questionpackage_work_answer_response.dart';
import 'package:json_annotation/json_annotation.dart';

part 'questionpackage_work_question_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class QuestionpackageWorkQuestionResponse {
  /// Returns a new [QuestionpackageWorkQuestionResponse] instance.
  QuestionpackageWorkQuestionResponse({

     this.answers,

     this.id,

     this.question,
  });

  @JsonKey(
    
    name: r'answers',
    required: false,
    includeIfNull: false,
  )


  final List<QuestionpackageWorkAnswerResponse>? answers;



  @JsonKey(
    
    name: r'id',
    required: false,
    includeIfNull: false,
  )


  final int? id;



  @JsonKey(
    
    name: r'question',
    required: false,
    includeIfNull: false,
  )


  final String? question;





    @override
    bool operator ==(Object other) => identical(this, other) || other is QuestionpackageWorkQuestionResponse &&
      other.answers == answers &&
      other.id == id &&
      other.question == question;

    @override
    int get hashCode =>
        answers.hashCode +
        id.hashCode +
        question.hashCode;

  factory QuestionpackageWorkQuestionResponse.fromJson(Map<String, dynamic> json) => _$QuestionpackageWorkQuestionResponseFromJson(json);

  Map<String, dynamic> toJson() => _$QuestionpackageWorkQuestionResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

