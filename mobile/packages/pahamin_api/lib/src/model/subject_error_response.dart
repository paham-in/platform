//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'subject_error_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class SubjectErrorResponse {
  /// Returns a new [SubjectErrorResponse] instance.
  SubjectErrorResponse({

     this.error,
  });

  @JsonKey(
    
    name: r'error',
    required: false,
    includeIfNull: false,
  )


  final String? error;





    @override
    bool operator ==(Object other) => identical(this, other) || other is SubjectErrorResponse &&
      other.error == error;

    @override
    int get hashCode =>
        error.hashCode;

  factory SubjectErrorResponse.fromJson(Map<String, dynamic> json) => _$SubjectErrorResponseFromJson(json);

  Map<String, dynamic> toJson() => _$SubjectErrorResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

