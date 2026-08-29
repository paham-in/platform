//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'questionpackage_error_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class QuestionpackageErrorResponse {
  /// Returns a new [QuestionpackageErrorResponse] instance.
  QuestionpackageErrorResponse({

     this.error,
  });

  @JsonKey(
    
    name: r'error',
    required: false,
    includeIfNull: false,
  )


  final String? error;





    @override
    bool operator ==(Object other) => identical(this, other) || other is QuestionpackageErrorResponse &&
      other.error == error;

    @override
    int get hashCode =>
        error.hashCode;

  factory QuestionpackageErrorResponse.fromJson(Map<String, dynamic> json) => _$QuestionpackageErrorResponseFromJson(json);

  Map<String, dynamic> toJson() => _$QuestionpackageErrorResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

