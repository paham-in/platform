//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'questionpackage_submit_answer_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class QuestionpackageSubmitAnswerResponse {
  /// Returns a new [QuestionpackageSubmitAnswerResponse] instance.
  QuestionpackageSubmitAnswerResponse({

     this.correctAnswerIds,

     this.explanation,

     this.isCorrect,
  });

  @JsonKey(
    
    name: r'correct_answer_ids',
    required: false,
    includeIfNull: false,
  )


  final List<int>? correctAnswerIds;



  @JsonKey(
    
    name: r'explanation',
    required: false,
    includeIfNull: false,
  )


  final String? explanation;



  @JsonKey(
    
    name: r'is_correct',
    required: false,
    includeIfNull: false,
  )


  final bool? isCorrect;





    @override
    bool operator ==(Object other) => identical(this, other) || other is QuestionpackageSubmitAnswerResponse &&
      other.correctAnswerIds == correctAnswerIds &&
      other.explanation == explanation &&
      other.isCorrect == isCorrect;

    @override
    int get hashCode =>
        correctAnswerIds.hashCode +
        explanation.hashCode +
        isCorrect.hashCode;

  factory QuestionpackageSubmitAnswerResponse.fromJson(Map<String, dynamic> json) => _$QuestionpackageSubmitAnswerResponseFromJson(json);

  Map<String, dynamic> toJson() => _$QuestionpackageSubmitAnswerResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

