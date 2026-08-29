//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'questionpackage_work_progress_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class QuestionpackageWorkProgressResponse {
  /// Returns a new [QuestionpackageWorkProgressResponse] instance.
  QuestionpackageWorkProgressResponse({

     this.completedCount,

     this.completedIds,

     this.correctAnswerIds,

     this.explanations,

     this.isCorrect,

     this.selectedAnswers,

     this.totalCount,
  });

  @JsonKey(
    
    name: r'completed_count',
    required: false,
    includeIfNull: false,
  )


  final int? completedCount;



  @JsonKey(
    
    name: r'completed_ids',
    required: false,
    includeIfNull: false,
  )


  final List<int>? completedIds;



  @JsonKey(
    
    name: r'correct_answer_ids',
    required: false,
    includeIfNull: false,
  )


  final Map<String, List<int>>? correctAnswerIds;



  @JsonKey(
    
    name: r'explanations',
    required: false,
    includeIfNull: false,
  )


  final Map<String, String>? explanations;



  @JsonKey(
    
    name: r'is_correct',
    required: false,
    includeIfNull: false,
  )


  final Map<String, bool>? isCorrect;



  @JsonKey(
    
    name: r'selected_answers',
    required: false,
    includeIfNull: false,
  )


  final Map<String, int>? selectedAnswers;



  @JsonKey(
    
    name: r'total_count',
    required: false,
    includeIfNull: false,
  )


  final int? totalCount;





    @override
    bool operator ==(Object other) => identical(this, other) || other is QuestionpackageWorkProgressResponse &&
      other.completedCount == completedCount &&
      other.completedIds == completedIds &&
      other.correctAnswerIds == correctAnswerIds &&
      other.explanations == explanations &&
      other.isCorrect == isCorrect &&
      other.selectedAnswers == selectedAnswers &&
      other.totalCount == totalCount;

    @override
    int get hashCode =>
        completedCount.hashCode +
        completedIds.hashCode +
        correctAnswerIds.hashCode +
        explanations.hashCode +
        isCorrect.hashCode +
        selectedAnswers.hashCode +
        totalCount.hashCode;

  factory QuestionpackageWorkProgressResponse.fromJson(Map<String, dynamic> json) => _$QuestionpackageWorkProgressResponseFromJson(json);

  Map<String, dynamic> toJson() => _$QuestionpackageWorkProgressResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

